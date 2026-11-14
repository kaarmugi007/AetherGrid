// BEGINNER-FRIENDLY EXPLANATIONS
// Short teaching text shown around the app. Two levels for each idea:
//   simple    = everyday language for someone new to cloud computing
//   technical = the correct cloud term and what the component really does
//
// This file contains NO data. Resources, counts and links always come from
// SQLite. We only choose which explanation to show, based on the values
// stored in each resource (attributes.kind, attributes.engine, or type).

// Core ideas used across the app
export const CONCEPTS = {
  architecture: {
    title: 'What is an architecture?',
    simple:
      'The overall plan of a cloud application: which parts it is made of and how they work together, like a floor plan for a building.',
    technical:
      'A reference architecture is a set of interconnected cloud resources (network, compute, data, security) arranged to deliver one workload.',
  },
  resource: {
    title: 'What is a cloud resource?',
    simple:
      'One building block of a cloud application, such as a server that runs code, a place that stores files, or a database that keeps records.',
    technical:
      'A resource is an individually managed cloud component (virtual machine, bucket, database, load balancer, role, …) with its own configuration and status.',
  },
  dependency: {
    title: 'What is a dependency?',
    simple:
      'When one part needs another part to do its job. If the part it needs stops working, it may stop working too.',
    technical:
      'A directed relationship: the source resource relies on the target resource. Failures travel in the opposite direction, from the target to everything that relies on it.',
  },
  event: {
    title: 'What is an event?',
    simple:
      'A note in the history log saying something happened to a resource: an alert, an update, a backup, or one of your simulations.',
    technical:
      'An activity record with a type, severity, timestamp and related resource. Sample events ship with the app; simulation events are written when you run the Failure Simulation Lab.',
  },
  layers: {
    title: 'Why are resources grouped into layers?',
    simple:
      'A request travels through an application in steps: it arrives through the network, passes security checks, is handled by servers and apps, and finally reads or saves data. Layers follow that journey from top to bottom.',
    technical:
      'Grouping by tier (edge/network, security, compute, application, data, storage) mirrors the request path and makes it easier to see which tiers depend on which.',
  },
  simulation: {
    title: 'What does the simulation show?',
    simple:
      'Pretend one part breaks, and see which other parts would be in trouble because they rely on it, directly or through a chain.',
    technical:
      'A breadth-first search over the dependency graph, starting at the failed resource and following "relies on" links in reverse, level by level.',
  },
};

// What each count on the Dashboard means
export const COUNT_HINTS = {
  resources: 'Individual cloud components',
  architectures: 'Example application designs',
  dependencies: 'Links where one part relies on another',
  events: 'Entries in the activity history',
};

// One explanation per resource TYPE (used for filters and layers)
export const TYPE_EXPLANATIONS = {
  network: {
    simple: 'Roads and doorways: how requests reach the application and move between its parts.',
    technical: 'Networking components: DNS, gateways, load balancers, CDNs, virtual networks and subnets.',
  },
  security: {
    simple: 'Locks and guards: who is allowed in and what they are allowed to do.',
    technical: 'Identity, access control, firewalls and encryption-key management.',
  },
  compute: {
    simple: 'The workers: machines that run the program code.',
    technical: 'Virtual machines, worker pools and serverless functions that execute workloads.',
  },
  application: {
    simple: 'Services that organise the work: APIs, queues and dashboards that connect everything.',
    technical: 'Application-level services such as APIs, message queues, data streams and web apps.',
  },
  database: {
    simple: 'Organised record keepers: they save and find information quickly.',
    technical: 'Managed databases and caches: relational, document, key-value and analytical engines.',
  },
  storage: {
    simple: 'Big storage rooms for files such as images, videos and backups.',
    technical: 'Object storage buckets, data lakes and backup vaults for unstructured data.',
  },
};

// Explanations for the specific kinds that appear in the dataset
// (matched against attributes.kind or attributes.engine).
const KIND_EXPLANATIONS = {
  'DNS zone': {
    title: 'DNS (Domain Name System)',
    simple: 'Like a phone book for the internet: it turns a website name into the address computers use to find it.',
    technical: 'A DNS zone holds the records that resolve the domain name to the entry point of the application.',
  },
  'Load balancer': {
    title: 'Load balancer',
    simple: 'Like a host at a restaurant, it sends each visitor to a server that is free so no single server gets overloaded.',
    technical: 'Distributes incoming requests across multiple healthy backend targets.',
  },
  'Web application firewall': {
    title: 'Web application firewall (WAF)',
    simple: 'A security guard at the front door that blocks suspicious visitors before they get inside.',
    technical: 'Inspects HTTP traffic and blocks requests that match attack patterns before they reach the application.',
  },
  'Service identity role': {
    title: 'Identity role',
    simple: 'An ID badge for a program that says exactly which doors it may open.',
    technical: 'An identity with a set of permissions that a service assumes; follows the least-privilege principle.',
  },
  'REST API service': {
    title: 'API service',
    simple: 'A waiter that takes requests from the website, fetches what is needed, and brings back the answer.',
    technical: 'Exposes a defined interface (endpoints) that other components call to read and change data.',
  },
  'API gateway': {
    title: 'API gateway',
    simple: 'A reception desk that receives incoming requests and passes them to the right place.',
    technical: 'A managed entry point that receives API calls and routes them to backend services.',
  },
  'Message queue': {
    title: 'Message queue',
    simple: 'A waiting line of jobs: work is added at one end and workers take it from the other when they are ready.',
    technical: 'Buffers messages between producers and consumers so they can work at different speeds.',
  },
  'Serverless function': {
    title: 'Serverless function',
    simple: 'A small piece of code that wakes up only when needed, does one job, and goes back to sleep.',
    technical: 'Event-triggered code run by the platform without managing servers; billed per execution.',
  },
  'Content delivery network': {
    title: 'Content delivery network (CDN)',
    simple: 'Copies of popular files kept in many places around the world so they load quickly for everyone.',
    technical: 'Caches content at edge locations close to users to reduce latency and load on the origin.',
  },
  'Key vault': {
    title: 'Key vault',
    simple: 'A safe that holds the secret keys used to lock (encrypt) and unlock data.',
    technical: 'Securely stores and rotates encryption keys used by other services.',
  },
  'Data stream': {
    title: 'Data stream',
    simple: 'A conveyor belt that carries a constant flow of small messages, like clicks, to be processed.',
    technical: 'Ingests ordered event records in near real time for downstream consumers.',
  },
  'Web dashboard': {
    title: 'Web dashboard',
    simple: 'A website where people look at charts and reports.',
    technical: 'A web application that queries a data store and visualises the results.',
  },
  'Access policy': {
    title: 'Access policy',
    simple: 'A rule book saying which people may see which information.',
    technical: 'A set of permission statements controlling which identities can access which resources.',
  },
  Subnet: {
    title: 'Subnet',
    simple: 'A private section of the network, like a staff-only area of a building.',
    technical: 'A range of addresses within a virtual network, used to isolate groups of resources.',
  },
  'VPN gateway': {
    title: 'VPN gateway',
    simple: 'A secure tunnel that lets staff reach private systems safely from outside the office.',
    technical: 'Terminates encrypted VPN connections into a private network.',
  },
  'Virtual network': {
    title: 'Virtual network',
    simple: 'A private, fenced-off network in the cloud where the application’s servers can talk to each other.',
    technical: 'An isolated software-defined network that contains subnets and controls traffic between resources.',
  },
  'Single sign-on': {
    title: 'Single sign-on (SSO)',
    simple: 'One login that opens many tools, so people do not need a separate password for each.',
    technical: 'A central identity service that authenticates users once and issues access to connected applications.',
  },
  'Relational (SQL)': {
    title: 'Relational database',
    simple: 'An organised set of tables, like linked spreadsheets, that stores records such as orders or staff details.',
    technical: 'Stores structured data in tables with relationships and is queried with SQL.',
  },
  'Key-value cache': {
    title: 'Cache',
    simple: 'A short-term memory that keeps frequently used information close by so it can be fetched very quickly.',
    technical: 'An in-memory key-value store used to speed up reads and hold temporary data such as sessions.',
  },
  'Document store': {
    title: 'Document database',
    simple: 'Stores each item as a flexible document, like a digital index card.',
    technical: 'A NoSQL database that stores semi-structured records (documents) without a fixed table schema.',
  },
  'Columnar warehouse': {
    title: 'Data warehouse',
    simple: 'A huge, well-organised archive built for answering big questions across lots of data.',
    technical: 'A column-oriented analytical database optimised for large aggregate queries.',
  },
};

// Fallbacks for resources whose data has no "kind"/"engine" field.
const TYPE_FALLBACK = {
  compute: {
    title: 'Virtual machine',
    simple: 'A computer that lives in the cloud and runs programs, just like a computer at home but in a data centre.',
    technical: 'A virtualised server with allocated vCPUs, memory and an operating system.',
  },
  storage: {
    title: 'Object storage',
    simple: 'An online storage room for files such as images, videos and backups.',
    technical: 'Stores files as objects in buckets or vaults with capacity and access settings.',
  },
};

// Picks the best explanation for one resource from its stored data.
export function explainResource(resource) {
  const kind = resource.attributes?.kind ?? resource.attributes?.engine;
  if (kind && KIND_EXPLANATIONS[kind]) return KIND_EXPLANATIONS[kind];
  if (TYPE_FALLBACK[resource.type]) return TYPE_FALLBACK[resource.type];
  const typeInfo = TYPE_EXPLANATIONS[resource.type];
  return {
    title: resource.type,
    simple: typeInfo?.simple ?? 'A component of this fictional cloud application.',
    technical: typeInfo?.technical ?? '',
  };
}
