import styled from 'styled-components';

export const LearnNowContainer = styled.div`
	display: flex;
	height: 100%;
	width: 100%;
	position: relative;
`;

export const ContentContainer = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 1.25rem;

	@media (max-width: 48rem) {
		padding: 0.75rem;
	}
`;

export const MobileMenuButton = styled.button`
	display: none;
	position: fixed;
	top: 120px;
	right: 1.8rem;
	z-index: 1001;
	background-color: #19c6c7;
	color: white;
	border: none;
	border-radius: 0.25rem;
	cursor: pointer;
	box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.2);
	font-size: 1rem;
	width: 2rem;
	height: 2rem;
	align-items: center;
	justify-content: center;

	&:hover {
		background-color: #17b0b1;
	}

	&:active {
		transform: scale(0.95);
	}

	@media (max-width: 48rem) {
		display: flex;
	}
`;

export const SidebarOverlay = styled.div<{$isOpen: boolean}>`
	display: none;

	@media (max-width: 48rem) {
		display: ${props => (props.$isOpen ? 'block' : 'none')};
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}
`;
