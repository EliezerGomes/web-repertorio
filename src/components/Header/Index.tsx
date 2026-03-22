import './index.css'; // vamos criar esse arquivo logo abaixo

export default function Header() {

  return (

      <div className="container">
        {/* Logo / Nome do app */}
        <div className="logo">
          <h1 className="text-headline" style={{color: "#BCC1FE", marginLeft: "20px"}}>
            Web Repertório
          </h1>
        </div>
      </div>

  );
}