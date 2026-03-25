/**
 * Validates if a URL is accessible
 * Note: Due to CORS restrictions, no-cors mode will always return opaque responses
 * For production, use a backend Edge Function for true validation
 */
export async function validateLink(url: string): Promise<boolean> {
  try {
    // Basic URL validation
    new URL(url);
    
    // For client-side, we can only do basic checks
    // Real validation should happen server-side
    const trustedDomains = [
      'youtube.com',
      'youtu.be',
      'coursera.org',
      'edx.org',
      'freecodecamp.org',
      'kaggle.com',
      'huggingface.co',
      'fast.ai',
      'developer.mozilla.org',
      'github.com',
      'udemy.com',
      'pluralsight.com',
      'linkedin.com/learning',
      'udacity.com',
      'codecademy.com',
      'khanacademy.org',
      'leetcode.com',
      'hackerrank.com',
      'aws.amazon.com',
      'cloud.google.com',
      'azure.microsoft.com',
      'datacamp.com',
      'tensorflow.org',
      'pytorch.org',
      'reactjs.org',
      'nodejs.org',
      'python.org',
      'golang.org',
      'rust-lang.org',
      'java.com',
      'oracle.com',
      'microsoft.com',
      'apple.com/developer',
      'android.com',
      'firebase.google.com',
      'kubernetes.io',
      'docker.com',
      'redis.io',
      'mongodb.com',
      'postgresql.org'
    ];

    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    // Check if domain is trusted
    const isTrusted = trustedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isTrusted) {
      console.warn(`Untrusted domain: ${hostname}`);
      return false;
    }

    // Try to fetch with no-cors (will always succeed for valid URLs due to opaque response)
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });

    return true;
  } catch (error) {
    console.error(`Invalid URL: ${url}`, error);
    return false;
  }
}

/**
 * Validates multiple links in parallel
 */
export async function validateLinks(urls: string[]): Promise<Record<string, boolean>> {
  const results = await Promise.all(
    urls.map(async (url) => ({
      url,
      valid: await validateLink(url)
    }))
  );

  return results.reduce((acc, { url, valid }) => {
    acc[url] = valid;
    return acc;
  }, {} as Record<string, boolean>);
}
