export const readdir = () => [];
export const readdirSync = () => [];
export const readFile = () => '';
export const readFileSync = () => '';
export const existsSync = () => false;
export const statSync = () => ({ isDirectory: () => false, isFile: () => false });
export const promises = { readFile: async () => '', readdir: async () => [] };

export default {
  readdir, readdirSync, readFile, readFileSync, existsSync, statSync, promises
};
