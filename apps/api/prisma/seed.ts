import { PrismaClient, Role, ResourceType, ResourceStatus, AccessResult } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Wayne@123';

async function main() {
  console.log('Limpando dados anteriores...');
  await prisma.auditLog.deleteMany();
  await prisma.accessLog.deleteMany();
  await prisma.areaPermission.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.area.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('Criando usuarios...');
  const bruce = await prisma.user.create({
    data: { name: 'Bruce Wayne', email: 'bruce@wayne.com', passwordHash, role: Role.SECURITY_ADMIN, jobTitle: 'Diretor Executivo' },
  });
  const lucius = await prisma.user.create({
    data: { name: 'Lucius Fox', email: 'lucius@wayne.com', passwordHash, role: Role.MANAGER, jobTitle: 'Gerente de Ciencias Aplicadas' },
  });
  const alfred = await prisma.user.create({
    data: { name: 'Alfred Pennyworth', email: 'alfred@wayne.com', passwordHash, role: Role.EMPLOYEE, jobTitle: 'Coordenador Predial' },
  });
  const barbara = await prisma.user.create({
    data: { name: 'Barbara Gordon', email: 'barbara@wayne.com', passwordHash, role: Role.EMPLOYEE, jobTitle: 'Analista de Sistemas' },
  });
  const selina = await prisma.user.create({
    data: { name: 'Selina Kyle', email: 'selina@wayne.com', passwordHash, role: Role.EMPLOYEE, jobTitle: 'Consultora Externa', isActive: false },
  });

  console.log('Criando areas...');
  const reception = await prisma.area.create({
    data: { name: 'Recepcao', code: 'REC-01', description: 'Saguao principal da Wayne Tower.', minimumRole: Role.EMPLOYEE },
  });
  const appliedSciences = await prisma.area.create({
    data: { name: 'Ciencias Aplicadas', code: 'APP-07', description: 'Laboratorio de prototipos e engenharia avancada.', minimumRole: Role.MANAGER },
  });
  const serverRoom = await prisma.area.create({
    data: { name: 'Sala de Servidores', code: 'SRV-03', description: 'Infraestrutura critica de dados da corporacao.', minimumRole: Role.MANAGER },
  });
  const hangar = await prisma.area.create({
    data: { name: 'Hangar Subterraneo', code: 'HGR-02', description: 'Garagem e manutencao da frota especial.', minimumRole: Role.SECURITY_ADMIN },
  });
  const batcave = await prisma.area.create({
    data: { name: 'Batcaverna', code: 'BAT-00', description: 'Centro de operacoes restrito.', minimumRole: Role.SECURITY_ADMIN },
  });

  console.log('Concedendo permissao individual...');
  await prisma.areaPermission.create({
    data: { userId: lucius.id, areaId: hangar.id, grantedById: bruce.id },
  });
  await prisma.areaPermission.create({
    data: { userId: barbara.id, areaId: serverRoom.id, grantedById: bruce.id },
  });

  console.log('Criando recursos...');
  const resources = [
    { name: 'Batmovel', type: ResourceType.VEHICLE, serialNumber: 'WV-0001', status: ResourceStatus.AVAILABLE, areaId: hangar.id, value: 4500000, description: 'Veiculo blindado de resposta rapida.' },
    { name: 'Batwing', type: ResourceType.VEHICLE, serialNumber: 'WV-0002', status: ResourceStatus.MAINTENANCE, areaId: hangar.id, value: 12000000, description: 'Aeronave de patrulha aerea.' },
    { name: 'Batciclo', type: ResourceType.VEHICLE, serialNumber: 'WV-0003', status: ResourceStatus.IN_USE, areaId: hangar.id, value: 380000 },
    { name: 'Van de Suporte Tatico', type: ResourceType.VEHICLE, serialNumber: 'WV-0004', status: ResourceStatus.AVAILABLE, areaId: hangar.id, value: 220000 },
    { name: 'Traje Tatico Mark VII', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1001', status: ResourceStatus.IN_USE, areaId: appliedSciences.id, value: 890000, description: 'Blindagem de fibra de memoria.' },
    { name: 'Gancho Pneumatico', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1002', status: ResourceStatus.AVAILABLE, areaId: appliedSciences.id, value: 45000 },
    { name: 'Batarangue Serie B', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1003', status: ResourceStatus.AVAILABLE, areaId: appliedSciences.id, value: 1200 },
    { name: 'Kit de Pericia Forense', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1004', status: ResourceStatus.AVAILABLE, areaId: appliedSciences.id, value: 32000 },
    { name: 'Analisador Quimico Portatil', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1005', status: ResourceStatus.MAINTENANCE, areaId: appliedSciences.id, value: 78000 },
    { name: 'Gerador de Emergencia', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1006', status: ResourceStatus.AVAILABLE, areaId: serverRoom.id, value: 156000 },
    { name: 'Prototipo Descontinuado XZ', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1007', status: ResourceStatus.RETIRED, areaId: appliedSciences.id, value: 5000 },
    { name: 'Drone de Vigilancia Falcao', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2001', status: ResourceStatus.IN_USE, areaId: hangar.id, value: 210000, description: 'Cobertura aerea autonoma de perimetro.' },
    { name: 'Scanner Biometrico de Iris', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2002', status: ResourceStatus.AVAILABLE, areaId: reception.id, value: 68000 },
    { name: 'Camera Termica Perimetral', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2003', status: ResourceStatus.AVAILABLE, areaId: reception.id, value: 24000 },
    { name: 'Servidor de Vigilancia Central', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2004', status: ResourceStatus.IN_USE, areaId: serverRoom.id, value: 430000 },
    { name: 'Torre de Comunicacao Criptografada', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2005', status: ResourceStatus.IN_USE, areaId: serverRoom.id, value: 950000 },
    { name: 'Sensor Sismico de Solo', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2006', status: ResourceStatus.MAINTENANCE, areaId: batcave.id, value: 88000 },
    { name: 'Cofre Blindado Nivel 5', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2007', status: ResourceStatus.AVAILABLE, areaId: batcave.id, value: 310000 },
    { name: 'Trava Eletromagnetica de Portao', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2008', status: ResourceStatus.AVAILABLE, areaId: hangar.id, value: 19000 },
    { name: 'Supercomputador Forense', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1008', status: ResourceStatus.IN_USE, areaId: batcave.id, value: 2700000 },
    { name: 'Estacao de Recarga Movel', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1009', status: ResourceStatus.AVAILABLE, areaId: hangar.id, value: 41000 },
    { name: 'Uniforme de Seguranca Padrao', type: ResourceType.EQUIPMENT, serialNumber: 'WE-1010', status: ResourceStatus.AVAILABLE, areaId: reception.id, value: 900 },
    { name: 'Radio Tatico Criptografado', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2009', status: ResourceStatus.AVAILABLE, areaId: reception.id, value: 3400 },
    { name: 'Detector de Metais Portico', type: ResourceType.SECURITY_DEVICE, serialNumber: 'WS-2010', status: ResourceStatus.AVAILABLE, areaId: reception.id, value: 27000 },
    { name: 'Caminhao de Contencao', type: ResourceType.VEHICLE, serialNumber: 'WV-0005', status: ResourceStatus.RETIRED, areaId: hangar.id, value: 145000 },
  ];

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  for (const [index, resource] of resources.entries()) {
    await prisma.resource.create({
      data: { ...resource, acquiredAt: daysAgo(30 + index * 11) },
    });
  }

  console.log('Gerando historico de acessos...');
  const users: Array<{ id: string; role: Role; isActive: boolean }> = [bruce, lucius, alfred, barbara, selina];
  const areas: Array<{ id: string; minimumRole: Role }> = [reception, appliedSciences, serverRoom, hangar, batcave];
  const rank: Record<Role, number> = { EMPLOYEE: 1, MANAGER: 2, SECURITY_ADMIN: 3 };
  const explicitGrants = new Set([`${lucius.id}:${hangar.id}`, `${barbara.id}:${serverRoom.id}`]);

  const logs: Array<{ userId: string; areaId: string; result: AccessResult; reason: string; createdAt: Date }> = [];

  for (let i = 0; i < 60; i += 1) {
    const user = users[i % users.length]!;
    const area = areas[(i * 3 + 1) % areas.length]!;
    const hasExplicit = explicitGrants.has(`${user.id}:${area.id}`);

    let result: AccessResult;
    let reason: string;

    if (!user.isActive) {
      result = AccessResult.DENIED;
      reason = 'Usuario inativo no sistema.';
    } else if (hasExplicit) {
      result = AccessResult.GRANTED;
      reason = 'Permissao individual concedida para a area.';
    } else if (rank[user.role] >= rank[area.minimumRole]) {
      result = AccessResult.GRANTED;
      reason = 'Nivel de acesso do cargo atende ao exigido pela area.';
    } else {
      result = AccessResult.DENIED;
      reason = 'Cargo nao atinge o nivel minimo exigido pela area.';
    }

    const created = new Date(Date.now() - Math.floor(i / 2) * 24 * 60 * 60 * 1000 - (i % 12) * 60 * 60 * 1000);
    logs.push({ userId: user.id, areaId: area.id, result, reason, createdAt: created });
  }

  await prisma.accessLog.createMany({ data: logs });

  console.log('Registrando trilha de auditoria inicial...');
  const seeded = await prisma.resource.findMany({ take: 6, orderBy: { createdAt: 'desc' } });
  await prisma.auditLog.createMany({
    data: seeded.map((resource, index) => ({
      actorId: index % 2 === 0 ? bruce.id : lucius.id,
      entity: 'Resource',
      entityId: resource.id,
      action: 'CREATE' as const,
      changes: { name: resource.name, status: resource.status },
      createdAt: daysAgo(index),
    })),
  });

  console.log('\nSeed concluido.');
  console.log('Credenciais de demonstracao (senha unica: %s)', DEMO_PASSWORD);
  console.table([
    { perfil: 'Administrador de Seguranca', email: bruce.email },
    { perfil: 'Gerente', email: lucius.email },
    { perfil: 'Funcionario', email: alfred.email },
    { perfil: 'Funcionario (com permissao especial)', email: barbara.email },
    { perfil: 'Funcionario (inativo)', email: selina.email },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
