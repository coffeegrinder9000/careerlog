'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addApplication(formData: FormData) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const company = formData.get('company') as string;
  const role = formData.get('role') as string;
  const status = (formData.get('status') as string) || 'applied';
  const notes = (formData.get('notes') as string) || null;

  if (!company || !role) return; // basic guard

  await prisma.application.create({
    data: {
      company,
      role,
      status,
      notes,
      userId: session.user.id,
    },
  });

  revalidatePath('/dashboard');
}

export async function deleteApplication(formData: FormData) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const id = formData.get('id') as string;
  if (!id) return;

  await prisma.application.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath('/dashboard');
}