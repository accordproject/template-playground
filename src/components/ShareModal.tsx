import React, { useState } from "react";
import { Modal, Input, Button, message } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import useAppStore from "../store/store";

const ShareModal: React.FC = () => {
    const {
        isShareModalOpen,
        setShareModalOpen,
        generateShareableLink,
        backgroundColor
    } = useAppStore((state) => ({
        isShareModalOpen: state.isShareModalOpen,
        setShareModalOpen: state.setShareModalOpen,
        generateShareableLink: state.generateShareableLink,
        backgroundColor: state.backgroundColor,
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

    return (
        <Modal
            title="Share Template"
            open={isShareModalOpen}
            onCancel={handleClose}
            afterOpenChange={(open) => {
                if (open) handleOpen();
            }}
            footer={null}
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
            </div>
        </Modal>
    );
};

export default ShareModal;
