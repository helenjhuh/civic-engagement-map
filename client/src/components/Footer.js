import React from "react";
import { SWAT_RED_RGB } from "../defs";

const rootStyles = {
  backgroundColor: SWAT_RED_RGB,
  marginTop: "3em",
  color: "white"
};

const Footer = () => (
  <div style={rootStyles}>
    <div className="container">
      <p className="text-center">Designed by Swarthmore College, Steven Fernandez. All Rights Reserved.</p>
    </div>
  </div>
);

export default Footer;