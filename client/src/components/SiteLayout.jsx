import { Layout } from "antd";
import { Link } from "@tanstack/react-router";

const { Header, Footer, Content } = Layout;

export default function SiteLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 99,
          padding: "0 24px",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
          height: "64px"
        }}
      >
        <Link to="/">
          <h3
            style={{
              margin: 0,
              padding: 0,
              fontWeight: 800,
              fontSize: "1.2rem",
              letterSpacing: "0.5px"
            }}
          >
            🔑 Afternote
          </h3>
        </Link>
        <appkit-button />
      </Header>

      <Content
        style={{
          padding: "16px"
        }}
      >
        {children}
      </Content>

      <Footer
        style={{
          textAlign: "center",
          borderTop: "1px solid #7c8bff40",
          padding: "16px"
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <a
            href="https://github.com/Salmandabbakuti"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: 500,
              transition: "color 0.3s ease"
            }}
          >
            ©{new Date().getFullYear()} Afternote. Powered by Fhenix
          </a>
        </div>
        <p
          style={{
            fontSize: "12px",
            margin: "0",
            color: "#999",
            fontWeight: 500
          }}
        >
          v0.0.2
        </p>
      </Footer>
    </Layout>
  );
}
