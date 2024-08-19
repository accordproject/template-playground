const fetchContent = async (fileName: string): Promise<string> => {
  const response = await fetch(`/src/content/${fileName}`);
  if (!response.ok) {
    throw new Error(`Content not found: ${fileName}`);
  }
  return response.text();
};

export default fetchContent;
