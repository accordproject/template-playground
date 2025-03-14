import styled from "styled-components";
import { SkeletonStyled } from "../styles/components/Skeleton";

// Define the props type (same as the original component)
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// The Skeleton component
function Skeleton({ className, ...props }: SkeletonProps) {
  return <SkeletonStyled className={className} {...props} />;
}

export { Skeleton };
