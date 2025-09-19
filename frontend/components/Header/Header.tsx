import { Container, Navbar, NavbarBrand } from "react-bootstrap";

const Header = () => {
  return (
    <Navbar expand="lg" className="bg-neutral-800">
      <Container>
        <NavbarBrand className="font-bold text-white" href="/">
          Cirno
        </NavbarBrand>
      </Container>
    </Navbar>
  );
};

export default Header;
