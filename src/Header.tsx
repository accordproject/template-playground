import './App.css';

function Header() {
  return (
    <div>
      <header className="App-header">
        <div>
          <div className="row">
            <div className="column">
                <img src='APLogo.png' height={50} />
            </div>
            <div className="column">
              <h2>Template Playground (Beta)</h2>
            </div>
            <div className="column">
              <p></p>
            </div>
            <div className="column">
              <a href="https://github.com/accordproject/template-engine/blob/main/README.md" target="_blank" rel="noopener noreferrer">Documentation</a> <br />
              <a href="https://github.com/accordproject/template-playground/issues" target="_blank" rel="noopener noreferrer">Issues</a><br />
              <a href="https://discord.gg/Zm99SKhhtA" target="_blank" rel="noopener noreferrer">Community</a>
            </div>
          </div>
        </div>
      </header>
    </div >
  );
}

export default Header;
