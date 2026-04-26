import * as zlib from 'browserify-zlib';

const patchedZlib = {
  ...zlib,
  constants: {
    Z_NO_FLUSH: 0,
    Z_PARTIAL_FLUSH: 1,
    Z_SYNC_FLUSH: 2,
    Z_FULL_FLUSH: 3,
    Z_FINISH: 4,
    Z_BLOCK: 5,
    Z_TREES: 6
  }
};

export const constants = patchedZlib.constants;
export default patchedZlib;
