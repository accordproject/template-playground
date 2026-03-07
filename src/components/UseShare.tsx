import { Button } from "antd";
import { ShareAltOutlined } from "@ant-design/icons";
import useAppStore from "../store/store";

const UseShare = () => {
  const setShareModalOpen = useAppStore(
    (state) => state.setShareModalOpen
  );

  const handleShareClick = () => {
    setShareModalOpen(true);
  };

  return (
    <div className="share-element">
      <Button icon={<ShareAltOutlined />} onClick={handleShareClick}>
        Share
      </Button>
    </div>
  );
};

export default UseShare;