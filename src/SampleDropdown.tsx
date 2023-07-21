
import type { MenuProps } from 'antd';
import { Button, Dropdown, Space, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import useAppStore from './store';

function SampleDropdown() {
  const samples = useAppStore((state) => state.samples)
  const loadSample = useAppStore((state) => state.loadSample)

  const items = samples.map(s => {
    return {
      label: s.NAME,
      key: s.NAME,
    }
  })

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key) {
      void loadSample(e.key);
      void message.info(`Loaded ${e.key} sample`);
    }
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return <Space>
    <Dropdown menu={menuProps}>
      <Button>
          Load Sample
          <DownOutlined />
      </Button>
    </Dropdown>
  </Space >
}

export default SampleDropdown;
