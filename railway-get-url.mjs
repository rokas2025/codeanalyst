// Railway GraphQL API client to get service URL
import https from 'https';

const RAILWAY_TOKEN = 'cec1ffa3-3a94-47bf-a6e2-d25f2880abb4';
const RAILWAY_API = 'backboard.railway.com';
const RAILWAY_PATH = '/graphql/v2';

// GraphQL query to get service domains
const query = `
query {
  me {
    id
    email
    projects {
      edges {
        node {
          id
          name
          services {
            edges {
              node {
                id
                name
                serviceInstances {
                  edges {
                    node {
                      domains {
                        serviceDomains {
                          domain
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const postData = JSON.stringify({ query });

const options = {
  hostname: RAILWAY_API,
  port: 443,
  path: RAILWAY_PATH,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RAILWAY_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚂 Connecting to Railway API...');
console.log(`📡 Endpoint: https://${RAILWAY_API}${RAILWAY_PATH}\n`);

const req = https.request(options, (res) => {
  let data = '';

  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Rate Limit: ${res.headers['x-ratelimit-remaining']}/${res.headers['x-ratelimit-limit']} remaining\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.errors) {
        console.error('❌ Railway API Error:');
        response.errors.forEach(error => {
          console.error(`  - ${error.message}`);
          if (error.extensions) {
            console.error(`    Details:`, error.extensions);
          }
        });
        return;
      }

      if (response.data && response.data.me) {
        const me = response.data.me;
        console.log('✅ Successfully connected to Railway!');
        console.log(`👤 User: ${me.email} (ID: ${me.id})\n`);
        
        if (me.projects && me.projects.edges.length > 0) {
          const projects = me.projects.edges;
          
          projects.forEach(({ node: project }) => {
            console.log(`📦 Project: ${project.name}`);
            console.log(`   ID: ${project.id}`);
            
            if (project.services.edges.length > 0) {
              project.services.edges.forEach(({ node: service }) => {
                console.log(`\n   🔧 Service: ${service.name}`);
                console.log(`      ID: ${service.id}`);
                
                if (service.serviceInstances.edges.length > 0) {
                  service.serviceInstances.edges.forEach(({ node: instance }) => {
                    if (instance.domains && instance.domains.serviceDomains.length > 0) {
                      instance.domains.serviceDomains.forEach(({ domain }) => {
                        console.log(`      🌐 URL: https://${domain}`);
                        
                        // Save to file for easy access
                        if (service.name === 'web') {
                          console.log(`\n   ✨ This is your DEVELOPMENT backend URL!`);
                          console.log(`   📝 Use this in Vercel: VITE_API_URL=https://${domain}`);
                          console.log(`   📝 Use this in Railway: GITHUB_CALLBACK_URL=https://${domain}/api/auth/github/callback`);
                        }
                      });
                    } else {
                      console.log(`      ⚠️  No domain configured yet`);
                      console.log(`      💡 Generate one in Railway Dashboard → Settings → Networking → Generate Domain`);
                    }
                  });
                } else {
                  console.log(`      ⏳ No active deployments yet`);
                }
              });
            } else {
              console.log(`   📭 No services found`);
            }
            console.log('');
          });
        } else {
          console.log('📭 No projects found');
        }
      } else {
        console.error('❌ Unexpected response structure');
        console.error(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();

