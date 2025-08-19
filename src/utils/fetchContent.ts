
const cache:Record<string,string>={}
const fetchContent = async (fileName: string): Promise<string> => {
  if (cache[fileName]) {
    return cache[fileName]; // return cached version instantly
  }
    const response = await fetch(
    `https://raw.githubusercontent.com/accordproject/template-playground/main/src/content/${fileName}`
  );

  if (!response.ok) {
    throw new Error(`Content not found: ${fileName}`);
  }

  const text = await response.text();
  cache[fileName] = text; // store in cache
  return text;
}
//prefetching
export const prefetchContent = (files: string[]) => {
  files.forEach((file) => {
    if (!cache[file]) {
      fetchContent(file).catch(() => {});
    }
  });
};

export default fetchContent;