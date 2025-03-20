import React, { useState } from "react";
import { Layout, Row, Col, Typography, Space, Button, Image, Grid } from "antd";
import {
  GithubOutlined,
  XOutlined,
  DiscordFilled,
  LinkedinFilled,
} from "@ant-design/icons";
import FOOTER_SECTION from "../constants/content/footer.json";
const { Footer } = Layout;
const { Text, Link } = Typography;
const { useBreakpoint } = Grid;
const CustomFooter: React.FC = () => {
  const year = new Date().getFullYear();
  const screens = useBreakpoint();
  const [hover, setHover] = useState(false);
  const[hovericon,sethoverIcon]=useState(0)
  const[hoverfooter,sethoverfooter]=useState(false)
  if (!screens.md) {
    return null;
  }
  return (
    <Footer
      style={{
        background: hoverfooter ? "#0F172E":"#1b2540",
        color: "white", 
        padding: "80px 50px 20px 50px",
      }}
      onMouseEnter={()=>sethoverfooter(true)}
      onMouseLeave={()=>sethoverfooter(false)}
    >
      <Row justify="space-between" align="top">
        <Col span={7}>
          <Space direction="vertical" size="middle">
            <Link href="https://www.accordproject.org" target="_blank" className="LogoLink" 
             onMouseEnter={() => setHover(true)} // Detect hover
             onMouseLeave={() => setHover(false)} // Detect when hover ends
            >
              <Image
                src="/logo.png"
                alt="Template Playground"
                preview={false}
                style={{ paddingRight: "1.5em", height: hover ? "38px":"36px"  }}
              />
            </Link>
            <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              The open source smart legal contract stack
            </Text>
            <Link href="mailto:admin@accordproject.org" >
              <Text strong style={{ color:hovericon==1 ? " rgba(200,222,255,0.65) ": "rgba(255, 255, 255, 0.65)" }} onMouseEnter={()=>sethoverIcon(1)} onMouseLeave={()=>sethoverIcon(0)}>
                admin@accordproject.org
              </Text>
            </Link>
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank">
              <Button
                size="large"
                style={{
                  padding: "5px 30px",
                  backgroundColor:hovericon==2 ?'#D3D3D3': "#19c6c7",
                  borderRadius: "5px",
                  color:"#050c40",
                  textAlign: "center",
                  border:'none',
                  fontSize:hovericon==2 ?'17px':'16px'
                }}
                onMouseEnter={()=>sethoverIcon(2)}
                onMouseLeave={()=>sethoverIcon(0)}
              >
                Join
              </Button>
            </Link>
          </Space>
        </Col>
        {FOOTER_SECTION.sections.map((section: any,j:number) => (
          <Col span={3} key={j}>
            <Space direction="vertical" size="middle">
              <Text
                strong
                style={{
                  color: "rgba(255, 255, 255, 0.65)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                }}
              >
                {section.title}
              </Text>
              {section.links.map((link: any,i:number) => (
                <Link
                  href={link.href}
                  key={i}
                  style={{ color: hovericon==(2*i+1)*(3*j+1)+10? "#A9A9A9":"white", fontSize: "15px" }}
                  onMouseEnter={()=>sethoverIcon((2*i+1)*(3*j+1)+10)}
                  onMouseLeave={()=>sethoverIcon(0)}
                >
                  {link.title}
                </Link >
              ))}
            </Space>
          </Col>
        ))}
      </Row>
      <Row justify="space-between" align="middle" style={{ marginTop: "80px" }}>
        <Col>
          <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
            copyright © {year} accord project &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/privacy"
              target="_blank"
              style={{ color:hovericon==3 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.65)" }} onMouseEnter={()=>sethoverIcon(3)} onMouseLeave={()=>sethoverIcon(0)}
            >
              trademark policy
            </Link>{" "}
            &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/brand-assets"
              target="_blank"
              style={{ color:hovericon==4 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.65)" }} onMouseEnter={()=>sethoverIcon(4)} onMouseLeave={()=>sethoverIcon(0)}
            >
              brand assets
            </Link>
          </Text>
        </Col>

        <Col>
          <Space>
            <Link
              href="https://github.com/accordproject"
              target="_blank"
              style={{ color:hovericon==5 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.65)" }} onMouseEnter={()=>sethoverIcon(5)} onMouseLeave={()=>sethoverIcon(0)}
            >
              <GithubOutlined style={{ fontSize:hovericon==5 ?"19px": "17px" }} />
            </Link>
            <Link
              href="https://twitter.com/AccordHQ"
              target="_blank"
              style={{ color:hovericon==6 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.65)" }} onMouseEnter={()=>sethoverIcon(6)} onMouseLeave={()=>sethoverIcon(0)}
            >
              <XOutlined style={{ fontSize:hovericon==6 ?"19px": "17px" }} />
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              style={{ color:hovericon==7 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.65)" }} onMouseEnter={()=>sethoverIcon(7)} onMouseLeave={()=>sethoverIcon(0)}
            >
              <DiscordFilled style={{ fontSize:hovericon==7 ?"19px": "17px" }} />
            </Link>
            <Link
              href="https://www.linkedin.com/company/accordproject/"
              target="_blank"
              style={{ color:hovericon==8 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.65)" }} onMouseEnter={()=>sethoverIcon(8)} onMouseLeave={()=>sethoverIcon(0)}
            >
              <LinkedinFilled style={{ fontSize:hovericon==8 ? "19px": "17px" }} />
            </Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default CustomFooter;
