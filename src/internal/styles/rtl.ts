import classNames from './classNames.js';

export function getDirectionClassName(name: string, isRTL = false) {
  return classNames(name, isRTL && `${name}__rtl`);
}

export function getNoFlipClassName(name: string, noFlip = false) {
  return classNames(name, noFlip && `${name}__noflip`);
}

export default getDirectionClassName;
