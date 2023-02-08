import keyboardJS from 'keyboardjs';
import { Modal } from './lib/modal';

const modalHTML = `
<p>Hi. The Remote Sync option requires an email address. We email you a code
that you click on, which sends you back to the outliner (as is). From then on, as you 
update your outline, it'll be synced remotely.</p>
<p>Every so often (a bit random unfortunately), the code will expire. When you click it,
you'll be asked to enter your email address again. And the process will repeat.</p>
<form id="signup" method="post" action="http://localhost:3200/accounts">
<input type="email" name="emailAddress" id="emailAddress"> 
<button type="submit">Send Auth Token</button>
</form>
`;

export const signupModal = new Modal({
  title: 'Signup',
  escapeExitable: true,
  keyboardContext: 'signup'
}, modalHTML);

// if there's a "save token" then you can remove the "signup" button
if(localStorage.getItem('authToken')) {
  document.getElementById('remote-sync').remove();
}
