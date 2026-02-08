const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Temporary layout - akan diupdate di fase berikutnya */}
      <div className="container mx-auto p-4">{children}</div>
    </div>
  );
};

export default Layout;
