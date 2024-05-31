import { Button, Divider } from "semantic-ui-react";

function AppHeader() {
  return (
    <div>
      <Divider vertical />
      <Button
        as="a"
        href="https://github.com/accordproject/template-engine/blob/main/README.md"
        target="_blank"
        rel="noopener noreferrer"
      >
        Documentation
      </Button>
      <Divider vertical />
      <Button
        as="a"
        href="https://github.com/accordproject/template-playground/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        Issues
      </Button>
      <Divider vertical />
      <Button
        as="a"
        href="https://discord.gg/Zm99SKhhtA"
        target="_blank"
        rel="noopener noreferrer"
      >
        Community
      </Button>
    </div>
  );
}

export default AppHeader;
