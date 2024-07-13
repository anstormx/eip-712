import React from "react";

export default function Button(props) {
  const { isLoading, children, ...rest } = props;

  return (
    <button
      className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
      {...rest}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
      ) : (
        children
      )}
    </button>
  );
}
