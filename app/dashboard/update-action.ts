'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateApplication(formData: FormData) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const id = formData.get('id') as string;
  const company = formData.get('company') as string;
  const role = formData.get('role') as string;
  const status = (formData.get('status') as string) || 'applied';
  const notes = (formData.get('notes') as string) || null;

  if (!id || !company || !role) return;

  // updateMany with userId check prevents users editing other people's data
  await prisma.application.updateMany({
    where: { id, userId: session.user.id },
    data: { company, role, status, notes },
  });

  revalidatePath('/dashboard');
}