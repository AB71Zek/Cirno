export const Header = () => {
  return (
    <nav className="navbar navbar-light bg-light">
      <div className="container">
        <a className="navbar-brand" href="#home">Navbar</a>
        <div className="navbar-nav">
          <a className="nav-link" href="#home">Home</a>
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href="#pricing">Pricing</a>
        </div>
      </div>
    </nav>
  );
};

export default Header;
