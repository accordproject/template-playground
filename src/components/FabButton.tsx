import { Fab, Action } from "react-tiny-fab";
import { MdExplore } from "react-icons/md";
import { FaCircleQuestion } from "react-icons/fa6";
import tour from "../components/Tour";

const FloatingFAB = () => {
  const startTourEvent = () => {
    void tour.start();
  };

  return (
    <Fab
      icon={<FaCircleQuestion />}
      alwaysShowTitle
      mainButtonStyles={{
        backgroundColor: "#1B2540",
        color: "white",
        width: "50px",
        height: "50px",
        boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.25)",
        borderRadius: "50%",
        transition: "all 0.3s ease-in-out",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "24px",
      }}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
      }}
    >
      <Action
        text="Start Tour"
        onClick={startTourEvent}
        style={{
          backgroundColor: "#444444",
          color: "white",
          width: "45px",
          height: "45px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "50%",
          fontSize: "22px",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "scale(1.1)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "scale(1)")
        }
      >
        <MdExplore />
      </Action>
    </Fab>
  );
};

export default FloatingFAB;
