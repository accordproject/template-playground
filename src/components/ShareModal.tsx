import React, { useState } from "react";
import { Modal, Input, Button, message, Tooltip, Space } from "antd";
import { CopyOutlined, CheckOutlined, TwitterOutlined, LinkedinOutlined, MailOutlined } from "@ant-design/icons";
import useAppStore from "../store/store";

const ShareModal: React.FC = () => {
    const {
        isShareModalOpen,
        setShareModalOpen,
        generateShareableLink,
        backgroundColor,
        textColor
    } = useAppStore((state) => ({
        isShareModalOpen: state.isShareModalOpen,
        setShareModalOpen: state.setShareModalOpen,
        generateShareableLink: state.generateShareableLink,
        backgroundColor: state.backgroundColor,
        textColor: state.textColor,
    }));

    const isDarkMode = backgroundColor === '#121212';

    const [hasCopied, setHasCopied] = useState(false);

    // We compute this only when the modal opens to avoid unnecessary re-computations
    const [shareLink, setShareLink] = useState("");

    const handleOpen = () => {
        setShareLink(generateShareableLink());
    };

    const handleClose = () => {
        setShareModalOpen(false);
        // Reset copy state when modal closes
        setTimeout(() => setHasCopied(false), 300);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setHasCopied(true);
            void message.success("Link copied to clipboard!");
            setTimeout(() => setHasCopied(false), 3000);
        } catch (err) {
            console.error("Failed to copy link: ", err);
            void message.error("Failed to copy link to clipboard.");
        }
    };

    const shareToTwitter = () => {
        const text = encodeURIComponent("Check out this Accord Project template!");
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${text}`, "_blank");
    };

    const shareToLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`, "_blank");
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent("Accord Project Template");
        const body = encodeURIComponent(`Check out this template I built using the Accord Project Template Playground:\n\n${shareLink}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    return (
        <Modal
            title="Share Template"
            open={isShareModalOpen}
            onCancel={handleClose}
            afterOpenChange={(open) => {
                if (open) handleOpen();
            }}
            className={isDarkMode ? 'dark-modal' : ''}
            footer={null} // We manage our own footer/layout to match SettingsModal
            width="90%"
            style={{ maxWidth: 480 }}
            centered
        >
            <div className="space-y-6 py-4">

                {/* Information Text */}
                <div className="flex flex-col gap-2">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Anyone with this link will be able to view and edit this template.
                    </p>
                </div>

                {/* Link Input & Copy */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                        readOnly
                        value={shareLink}
                        onFocus={(e) => e.target.select()}
                        className={`font-mono text-sm flex-1 ${isDarkMode ? 'bg-[#1e1e1e] text-gray-300 border-gray-600' : ''}`}
                    />
                    <Button
                        type="primary"
                        icon={hasCopied ? <CheckOutlined /> : <CopyOutlined />}
                        onClick={() => void handleCopy()}
                        className="w-full sm:w-auto"
                    >
                        {hasCopied ? "Copied!" : "Copy"}
                    </Button>
                </div>

                <hr className={isDarkMode ? 'border-gray-600' : 'border-gray-200'} />

                {/* Social Share */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base" style={{ color: textColor }}>
                            Share Externally
                        </h4>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Post your template link directly to your social platforms
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Space size="middle">
                            <Tooltip title="Share on Twitter/X">
                                <Button
                                    shape="circle"
                                    icon={<TwitterOutlined />}
                                    onClick={shareToTwitter}
                                    style={{ color: '#1DA1F2', borderColor: '#1DA1F2', background: 'transparent' }}
                                />
                            </Tooltip>
                            <Tooltip title="Share on LinkedIn">
                                <Button
                                    shape="circle"
                                    icon={<LinkedinOutlined />}
                                    onClick={shareToLinkedIn}
                                    style={{ color: '#0A66C2', borderColor: '#0A66C2', background: 'transparent' }}
                                />
                            </Tooltip>
                            <Tooltip title="Share via Email">
                                <Button
                                    shape="circle"
                                    icon={<MailOutlined />}
                                    onClick={shareViaEmail}
                                    style={{ background: 'transparent' }}
                                    className={isDarkMode ? 'text-gray-300 border-gray-500' : 'text-gray-600'}
                                />
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ShareModal;
