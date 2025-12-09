import { KeyEventDefinition } from "./base";

async function insertPlainTextAtCaret(text: string) {
    const active = document.activeElement as HTMLElement | null;
    if (!active) {
        return;
    }

    // Input or Textarea
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        const el = active;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const before = el.value.substring(0, start);
        const after = el.value.substring(end);
        el.value = `${before}${text}${after}`;
        const caretPos = start + text.length;
        el.selectionStart = caretPos;
        el.selectionEnd = caretPos;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }

    // ContentEditable
    const isContentEditable =
        (active as HTMLElement).isContentEditable ||
        (!!active.closest('[contenteditable="true"]'));

    if (isContentEditable) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);
        range.deleteContents();

        // Split text by newline and insert as separate text nodes with <br> between lines
        const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const textNode = document.createTextNode(lines[i]);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            if (i < lines.length - 1) {
                const br = document.createElement('br');
                range.insertNode(br);
                range.setStartAfter(br);
                range.collapse(true);
            }
        }

        selection.removeAllRanges();
        selection.addRange(range);
    }
}

async function pastePlainAction(e: keyboardJS.KeyEvent) {
    e.preventDefault();
    e.preventRepeat();
    try {
        const text = await navigator.clipboard.readText();
        console.log('text', text);
        if (typeof text === 'string' && text.length > 0) {
            await insertPlainTextAtCaret(text);
        }
    } catch (err) {
        // If Clipboard API is unavailable/blocked, do nothing silently
    }
}

export const pastePlainEditing: KeyEventDefinition = {
    context: 'editing',
    keys: ['meta + shift + v', 'ctrl + shift + v'],
    description: 'Paste clipboard as plain text (no formatting)',
    action: async ({ e }) => {
        console.log('paste plain editing', e);
        if ((!e.metaKey && !e.ctrlKey) || !e.shiftKey) {
            console.log('not (meta or ctrl) or shift');
            return;
        }
        await pastePlainAction(e);
    }
};

