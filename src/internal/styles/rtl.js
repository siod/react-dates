import classNames from './classNames';

export function getDirectionClassName(name, isRTL = false) {
  return classNames(name, isRTL && `${name}__rtl`);
}

export function getNoFlipClassName(name, noFlip = false) {
  return classNames(name, noFlip && `${name}__noflip`);
}

export default getDirectionClassName;
