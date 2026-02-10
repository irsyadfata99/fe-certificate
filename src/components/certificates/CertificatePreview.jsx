import React from "react";
import PropTypes from "prop-types";

/**
 * CertificatePreview Component
 * Renders a printable certificate in A4 Landscape format
 * Matches the DOCX template layout with exact font styling
 */
const CertificatePreview = React.forwardRef(
  ({ studentName, moduleName, moduleCode, division, ptcDate }, ref) => {
    // Format date to readable format (e.g., "10 February 2026")
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const options = { day: "numeric", month: "long", year: "numeric" };
      return date.toLocaleDateString("en-GB", options);
    };

    // Determine module color based on division
    const getModuleColor = (div) => {
      switch (div?.toUpperCase()) {
        case "JK":
          return "#FF00FF"; // Magenta (as per template)
        case "LK":
          return "#0066CC"; // Blue
        default:
          return "#000000"; // Black fallback
      }
    };

    return (
      <div ref={ref} className="certificate-container">
        {/* Print-specific styles */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;600;700&display=swap');
            
            @media print {
              @page {
                size: A4 landscape;
                margin: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
              }
              
              .certificate-container {
                width: 297mm;
                height: 210mm;
                page-break-after: always;
                page-break-inside: avoid;
              }

              .no-print {
                display: none !important;
              }
            }

            /* A4 Landscape dimensions: 297mm x 210mm */
            .certificate-container {
              width: 297mm;
              height: 210mm;
              background: white;
              position: relative;
              overflow: hidden;
            }

            /* Student Name - Playfair Display 34pt Bold, Centered */
            .student-name {
              font-family: 'Playfair Display', serif;
              font-size: 34pt;
              font-weight: 700;
              text-align: center;
              color: #000000;
              position: absolute;
              width: 100%;
              /* Positioning based on template analysis - adjust if needed */
              top: 95mm;
              left: 0;
              right: 0;
              padding: 0 25.4mm; /* Match template margins */
            }

            /* Module Name - Montserrat 28pt Bold, Centered, Color by Division */
            .module-name {
              font-family: 'Montserrat', sans-serif;
              font-size: 28pt;
              font-weight: 700;
              text-align: center;
              position: absolute;
              width: 100%;
              /* Positioning based on template analysis - adjust if needed */
              top: 130mm;
              left: 0;
              right: 0;
              padding: 0 25.4mm; /* Match template margins */
            }

            /* PTC Date - Montserrat 18pt Regular, Left-aligned */
            .ptc-date {
              font-family: 'Montserrat', sans-serif;
              font-size: 18pt;
              font-weight: 400;
              text-align: left;
              color: #000000;
              position: absolute;
              /* Positioning based on template analysis - adjust if needed */
              top: 170mm;
              left: 25.4mm; /* Match template left margin */
            }

            /* Optional: Background template placeholder */
            .certificate-background {
              width: 100%;
              height: 100%;
              background: #FFFFFF;
              /* If you have a background image/template, uncomment below: */
              /* background-image: url('/path/to/certificate-template.png'); */
              /* background-size: cover; */
              /* background-position: center; */
            }
          `}
        </style>

        {/* Certificate Content */}
        <div className="certificate-background">
          {/* Student Name */}
          <div className="student-name">{studentName}</div>

          {/* Module Name with Division Color */}
          <div
            className="module-name"
            style={{ color: getModuleColor(division) }}
          >
            {moduleName || moduleCode}
          </div>

          {/* PTC Date */}
          <div className="ptc-date">{formatDate(ptcDate)}</div>
        </div>
      </div>
    );
  },
);

CertificatePreview.displayName = "CertificatePreview";

CertificatePreview.propTypes = {
  studentName: PropTypes.string.isRequired,
  moduleName: PropTypes.string,
  moduleCode: PropTypes.string,
  division: PropTypes.oneOf(["JK", "LK"]).isRequired,
  ptcDate: PropTypes.string.isRequired,
};

CertificatePreview.defaultProps = {
  moduleName: "",
  moduleCode: "",
};

export default CertificatePreview;
