import {CloseOutlined, MenuOutlined} from '@ant-design/icons';
import React, {useState} from 'react';
import {Outlet} from 'react-router-dom';
import LearningPathwaySidebar from '../components/LearningPathwaySidebar';
import {steps} from '../constants/learningSteps/steps';
import {
	ContentContainer,
	LearnNowContainer,
	MobileMenuButton,
	SidebarOverlay,
} from '../styles/pages/LearnNow';

const LearnNow: React.FC = () => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const closeSidebar = () => {
		setIsSidebarOpen(false);
	};

	return (
		<LearnNowContainer>
			<MobileMenuButton onClick={toggleSidebar} aria-label="Toggle sidebar">
				{isSidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
			</MobileMenuButton>

			<SidebarOverlay $isOpen={isSidebarOpen} onClick={closeSidebar} />

			<LearningPathwaySidebar
				steps={steps}
				isOpen={isSidebarOpen}
				onClose={closeSidebar}
			/>

			<ContentContainer>
				<Outlet />
			</ContentContainer>
		</LearnNowContainer>
	);
};

export default LearnNow;
