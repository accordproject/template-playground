import {
  Container,
  Dropdown,
  Header,
  Icon,
  Image,
  Menu,
} from "semantic-ui-react";

function Navbar({ scrollToExplore }: { scrollToExplore: any }) {
  return (
    <Menu
      fixed="top"
      inverted
      style={{ background: "#1b2540", height: "65px" }}
    >
      <Container>
        <Menu.Item as="a" header>
          <Image
            size="small"
            href="https://www.accordproject.org"
            src="/logo.png"
            style={{ marginRight: "1.5em" }}
            target="_blank"
          />
          Template Playground{" "}
        </Menu.Item>
        <Menu.Item as="a" onClick={scrollToExplore}>
          Explore
        </Menu.Item>

        <Dropdown item simple text="Help">
          <Dropdown.Menu>
            <Header as="h4">Info</Header>
            <Menu.Item
              href="https://github.com/accordproject/template-playground/blob/main/README.md"
              target="_blank"
            >
              <Icon name="question" /> About
            </Menu.Item>
            <Menu.Item
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
            >
              <Icon name="user" /> Community
            </Menu.Item>
            <Menu.Item
              href="https://github.com/accordproject/template-playground/issues"
              target="_blank"
            >
              <Icon name="info" /> Issues
            </Menu.Item>
            <Header as="h4">Documentation</Header>
            <Menu.Item
              href="https://github.com/accordproject/template-engine/blob/main/README.md"
              target="_blank"
            >
              <Icon name="book" /> Documentaion
            </Menu.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Menu.Item as="a" position="right">
          <Icon name="github" size="large" style={{ color: "white" }} /> Github
        </Menu.Item>
      </Container>
    </Menu>
  );
}

export default Navbar;
