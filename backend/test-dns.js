const dns = require('dns');
const resolver = new dns.Resolver();

// Try with Cloudflare's public DNS
resolver.setServers(['1.1.1.1', '1.0.0.1']);

resolver.resolve4('gateway0us-east-1.prod.aws.tidbcloud.com', (err, addresses) => {
  if (err) {
    console.error('✗ DNS resolution failed:', err.message);
    // Try with default system DNS
    dns.resolve4('gateway0us-east-1.prod.aws.tidbcloud.com', (err2, addrs2) => {
      if (err2) {
        console.error('✗ System DNS also failed:', err2.message);
      } else {
        console.log('✓ System DNS resolved:', addrs2);
      }
    });
  } else {
    console.log('✓ Cloudflare DNS resolved:', addresses);
  }
});
