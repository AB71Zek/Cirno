import { Container, Navbar, NavbarBrand } from "react-bootstrap";

const Header = () => {
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <NavbarBrand className="font-bold" href="#">
          Cirno
        </NavbarBrand>
      </Container>
    </Navbar>
  );
};

export default Header;
