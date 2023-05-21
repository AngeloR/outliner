import {KeyEventDefinition} from "./base";
import { sidebarToggle } from "./sidebar-toggle";
import { j } from './j';
import {k} from "./k";
import {l} from './l';
import {h} from "./h";
import {z} from "./z";
import {$} from "./$";
import {i} from "./i";
import {archive} from "./archive";
import {tab} from "./tab";
import {enter} from "./enter";
import {d} from "./delete";
import {lift} from "./lift";
import {lower} from "./lower";
import {swapUp} from "./swap-up";
import {swapDown} from "./swap-down";
import {escapeEditing} from "./escape-editing";
import { publish } from "./publish";

export const AllShortcuts: KeyEventDefinition[] = [
  sidebarToggle,
  j,
  k,
  l,
  h,
  z,
  $,
  i,
  archive,
  tab,
  enter,
  d,
  lift,
  lower,
  swapUp,
  swapDown,
  escapeEditing,
  publish
];
