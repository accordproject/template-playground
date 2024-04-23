import {
  Container,
  Divider,
  Dropdown,
  Grid,
  Image,
  List,
  Menu,
  Segment,
} from "semantic-ui-react";

function Navbar() {
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
        <Menu.Item as="a">Home</Menu.Item>

        <Dropdown item simple text="Dropdown">
          <Dropdown.Menu>
            <Dropdown.Item>List Item</Dropdown.Item>
            <Dropdown.Item>List Item</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Header>Header Item</Dropdown.Header>
            <Dropdown.Item>
              <i className="dropdown icon" />
              <span className="text">Submenu</span>
              <Dropdown.Menu>
                <Dropdown.Item>List Item</Dropdown.Item>
                <Dropdown.Item>List Item</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Item>
            <Dropdown.Item>List Item</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Container>
    </Menu>
  );
}

export default Navbar;
