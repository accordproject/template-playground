import { useEffect, useState } from "react";
import { ArrowDownOutlined } from "@ant-design/icons";

const FloatingFAB = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Function to scroll smoothly to the footer
  const scrollToFooter = () => {
    const footer = document.getElementById("footer"); // Ensure footer has this ID in your HTML
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Show the button only when the user scrolls up
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < window.innerHeight * 0.2);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    isVisible && (
      <button
        onClick={scrollToFooter}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "40px",
          height: "40px",
          backgroundColor: "#1B2540",
          color: "white",
          border: "none",
          borderRadius: "50%",
          boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.25)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "16px",
          cursor: "pointer",
          transition: "all 0.3s ease-in-out",
        }}
        aria-label="Scroll to footer"
      >
        <ArrowDownOutlined  />
      </button>
    )
  );
};

export default FloatingFAB;
