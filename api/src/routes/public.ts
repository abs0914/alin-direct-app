/**
 * Public routes (no auth required) — port of VerifyInsuranceController.php
 */
import { FastifyInstance } from 'fastify';
import { prisma } from '../server.js';

export default async function publicRoutes(app: FastifyInstance) {
  // GET /verify/pai/:policyNumber — public insurance policy verification
  app.get('/pai/:policyNumber', async (request, reply) => {
    const { policyNumber } = request.params as { policyNumber: string };

    const insurance = await prisma.personalAccidentInsurance.findUnique({
      where: { policyNumber },
      include: { customer: { include: { user: true } }, branch: true },
    });

    if (!insurance) {
      return reply.code(404).send({
        valid: false,
        message: 'Policy not found.',
        policy_number: policyNumber,
      });
    }

    const isActive = insurance.status === 'active' && insurance.validUntil >= new Date();

    return {
      valid: isActive,
      policy_number: insurance.policyNumber,
      full_name: insurance.fullName,
      status: insurance.status,
      valid_from: insurance.validFrom.toISOString().split('T')[0],
      valid_until: insurance.validUntil.toISOString().split('T')[0],
      branch_name: insurance.branch?.name,
    };
  });
}
