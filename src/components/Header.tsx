import { Button, Divider } from "antd";

function AppHeader() {
  return (
    <div>
        <Divider type="vertical"/>
        <Button type="link" onClick={() =>  window.location.href='https://github.com/accordproject/template-engine/blob/main/README.md'}>Documentation</Button>
        <Divider type="vertical"/>
        <Button type="link" onClick={() =>  window.location.href='https://github.com/accordproject/template-playground/issues'}>Issues</Button>
        <Divider type="vertical"/>
        <Button type="link" onClick={() =>  window.location.href='https://discord.gg/Zm99SKhhtA'}>Community</Button>
    </div >
  );
}

export default AppHeader;
