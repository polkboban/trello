import './globals.css';

export const metadata = {
  title: 'Trello Clone',
  description: 'A Trello-style project management app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
