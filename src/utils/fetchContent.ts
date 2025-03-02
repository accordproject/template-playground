const fetchContent = async (fileName: string): Promise<string> => {
  const response = await fetch(
    `https://raw.githubusercontent.com/accordproject/template-playground/main/src/content/${fileName}`,
  );
  if (!response.ok) {
    throw new Error(`Content not found: ${fileName}`);
  }
  return response.text();
};

export default fetchContent;
