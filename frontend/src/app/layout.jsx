import './globals.css';
import ThemeProvider from '../components/ThemeProvider';

export const metadata = {
  title: 'Trello Clone',
  description: 'Trello-style project management app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="transition-colors duration-300">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
