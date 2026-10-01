/**
 * Desktop endpoint registry singleton.
 *
 * The rules live in `@shega/shared` so mobile runs the identical implementation;
 * this file only exists to give the desktop main process one process-wide
 * instance. Every discovery mechanism records here and every transport selects
 * from here, so a phone seen over mDNS and over UDP is one device with two
 * candidate addresses rather than two peers.
 */

import { EndpointRegistry } from '@shega/shared';

export const endpointRegistry = new EndpointRegistry();

export type { RegistryDevice, RecordInput } from '@shega/shared';
