import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Tooltip, Divider } from 'antd';
import { CopyOutlined, CheckOutlined, MailOutlined, WhatsAppOutlined, LinkOutlined } from '@ant-design/icons';
import useAppStore from '../store/store';
import '../styles/components/ShareModal.css';

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ open, onClose }) => {
    const generateShareableLink = useAppStore((state) => state.generateShareableLink);
    const [link, setLink] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open) {
            setLink(generateShareableLink());
            setCopied(false);
        }
    }, [open, generateShareableLink]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            void message.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            void message.error('Failed to copy link');
        }
    };

    const handleShareEmail = () => {
        const subject = 'Check out this Accord Project Template';
        const body = `I created this smart legal contract template on the Accord Project Playground.\n\nCheck it out here: ${link}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleShareWhatsApp = () => {
        const text = `Check out this smart legal contract template: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2 text-lg">
                    <LinkOutlined className="text-[#19c6c7]" />
                    <span>Share Playground</span>
                </div>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            className="share-modal"
            width={500}
        >
            <div className="flex flex-col gap-4 py-2">
                <p className="text-gray-500 m-0 leading-normal">
                    Share your template configuration with others. The generated link contains all your current models, logic, and data.
                </p>

                <div className="flex gap-2">
                    <Input
                        value={link}
                        readOnly
                        className="font-mono text-sm bg-gray-50 text-gray-600 border-gray-300"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <Tooltip title={copied ? "Copied!" : "Copy link"}>
                        <Button
                            type="primary"
                            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                            onClick={() => void handleCopy()}
                            className={`${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-[#19c6c7] hover:bg-[#16b1b2]'} border-none transition-colors duration-300`}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </Tooltip>
                </div>

                <Divider style={{ margin: '16px 0 12px 0' }}><span className="text-xs text-gray-400 font-medium tracking-wide">SHARE VIA</span></Divider>

                <div className="flex gap-3 justify-center">
                    <Button icon={<MailOutlined />} onClick={handleShareEmail} className="flex items-center">Email</Button>
                    <Button icon={<WhatsAppOutlined className="text-[#25D366]" />} onClick={handleShareWhatsApp} className="flex items-center">WhatsApp</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ShareModal;
