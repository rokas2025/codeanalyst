// Railway GraphQL API client to get service URL
const https = require('https');

const RAILWAY_TOKEN = 'cec1ffa3-3a94-47bf-a6e2-d25f2880abb4';
const RAILWAY_API = 'backboard.railway.app';

// GraphQL query to get service domain
const query = `
query {
  me {
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
  path: '/graphql/v2',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RAILWAY_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚂 Connecting to Railway API...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.errors) {
        console.error('❌ Railway API Error:');
        console.error(JSON.stringify(response.errors, null, 2));
        return;
      }

      if (response.data && response.data.me && response.data.me.projects) {
        console.log('✅ Successfully connected to Railway!\n');
        
        const projects = response.data.me.projects.edges;
        
        projects.forEach(({ node: project }) => {
          console.log(`📦 Project: ${project.name} (ID: ${project.id})`);
          
          project.services.edges.forEach(({ node: service }) => {
            console.log(`  └─ Service: ${service.name} (ID: ${service.id})`);
            
            if (service.serviceInstances.edges.length > 0) {
              service.serviceInstances.edges.forEach(({ node: instance }) => {
                if (instance.domains && instance.domains.serviceDomains.length > 0) {
                  instance.domains.serviceDomains.forEach(({ domain }) => {
                    console.log(`     🌐 URL: https://${domain}`);
                  });
                } else {
                  console.log(`     ⚠️  No domain configured yet - need to generate one!`);
                }
              });
            }
          });
          console.log('');
        });
      } else {
        console.error('❌ Unexpected response structure');
        console.error(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();

