import React, { useState } from 'react';

const FALLBACK_IMAGE = '/item-image-placeholder.svg';

export default function ListingImage({ src, alt = '', ...imageProps }) {
  const [failedSource, setFailedSource] = useState('');
  const source = src || FALLBACK_IMAGE;

  return (
    <img
      {...imageProps}
      src={failedSource === source ? FALLBACK_IMAGE : source}
      alt={alt}
      onError={() => setFailedSource(source)}
    />
  );
}