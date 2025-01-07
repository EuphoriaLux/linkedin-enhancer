// tailwind.config.js

module.exports = {
  content: [
    './src/**/*.{html,js,jsx}', // Adjust paths as needed
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)', // e.g., #1DA1F2 for Twitter Blue
        'primary-hover': 'var(--primary-hover)', // Darker shade for hover
        secondary: 'var(--secondary-color)', // e.g., #17bf63 for Twitter Green
        'secondary-hover': 'var(--secondary-hover)', // Darker shade for hover
        success: 'var(--success-color)', // e.g., #28a745
        error: 'var(--error-color)', // e.g., #dc3545
        warning: 'var(--warning-color)', // e.g., #ffc107
        info: 'var(--info-color)', // e.g., #17a2b8
      },
      // Extend other properties as needed
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
