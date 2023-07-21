import { Button, Space } from 'antd';

function Links() {
  return <div style={{ paddingLeft: 40}}>
    <Space>
      <a href="https://github.com/accordproject/template-engine/blob/main/README.md" target="_blank" rel="noopener noreferrer">
        <Button type="primary">Documentation</Button>
      </a>
      <a href="https://discord.com/invite/Zm99SKhhtA" target="_blank" rel="noopener noreferrer">
        <Button type="primary">Community</Button>
      </a>
      <a href="https://github.com/accordproject/template-playground/issues" target="_blank" rel="noopener noreferrer">
        <Button type="primary">Issues</Button>
      </a>
    </Space>
  </div>
}

export default Links;
