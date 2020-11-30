export const UI_THEME = {
    extends: "dark",
    background: "rgba(51,51,51,0.9)",
    backgroundAlt: "#222222",
  
    controlColorPrimary: "#858586",
    controlColorSecondary: "#636364",
    controlColorDisabled: "#404042",
    controlColorHovered: "#F8F8F9",
    controlColorActive: "#5B91F4",
  
    textColorPrimary: "#F8F8F9",
    textColorSecondary: "#D0D0D1",
    textColorDisabled: "#717172",
    textColorInvert: "#1B1B1C",
  
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    fontSize: 14,
    fontWeight: 200,
  
    shadow: "0 2px 4px 0 rgba(0, 0, 0, 0.15)"
  };

  export const OBJECT_THEME = {
    ['Car']:{
      fill_color: '#50B3FF80',
      stroke_color: '#50B3FF'
    },
    ['Cyclist']:{
      fill_color: '#957FCE80',
      stroke_color: '#957FCE'
},
    ['Pedestrian']:{
      fill_color: '#FFC6AF80',
      stroke_color: '#FFC6AF'
    },
    ['Unknown']:{
      fill_color: '#E2E2E280',
      stroke_color: '#E2E2E2'
    },
  };