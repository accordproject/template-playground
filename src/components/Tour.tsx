import { useEffect } from "react";
import "../styles/components/Tour.css";
import "shepherd.js/dist/css/shepherd.css";

import { createTour } from "../tour/tourConfig";

const Tour = () => {

  useEffect(() => {

    const tour = createTour();

    tour.start();

  }, []);

  return null;
};

export default Tour;