import { useState } from 'react';
import { userApi } from '../api/client';
import type { UserCreateRequest, UserResponse } from '../types/api';

export function Users() {
  const [createForm, setCreateForm] = useState<UserCreateRequest>({
    email: '',
    name: '',
    role: 'USER',
  });
  const [created, setCreated] = useState<UserResponse | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [nameSearch, setNameSearch] = useState('');
  const [userList, setUserList] = useState<UserResponse[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreated(null);
    try {
      const res = await userApi.create(createForm);
      setCreated(res);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleSearchByName = (e: React.FormEvent) => {
    e.preventDefault();
    setListError(null);
    setListLoading(true);
    userApi
      .list(nameSearch.trim() || undefined)
      .then(setUserList)
      .catch((err) => {
        setListError(err instanceof Error ? err.message : 'Failed');
        setUserList([]);
      })
      .finally(() => setListLoading(false));
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-white">사용자</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">사용자 생성</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">이메일</label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">이름</label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">역할</label>
              <select
                value={createForm.role ?? 'USER'}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as 'USER' | 'ADMIN' }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              생성
            </button>
          </form>
          {createError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{createError}</p>}
          {created && (
            <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm dark:bg-zinc-800">
              <p className="font-medium text-slate-700 dark:text-white">생성됨</p>
              <p className="dark:text-slate-300">ID: {created.id}, 이름: {created.name}, 역할: {created.role}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">사용자 ID 조회</h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            사용자 이름을 입력하면 해당하는 사용자 ID를 확인할 수 있습니다. 비우고 조회하면 전체 목록이 나옵니다.
          </p>
          <form onSubmit={handleSearchByName} className="flex gap-2">
            <input
              type="text"
              placeholder="사용자 이름"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={listLoading}
              className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              {listLoading ? '조회 중…' : '조회'}
            </button>
          </form>
          {listError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{listError}</p>}
          {userList.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm text-slate-700 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-200 text-left font-medium text-slate-600 dark:border-zinc-600 dark:text-slate-400">
                    <th className="py-2 pr-4">사용자 ID</th>
                    <th className="py-2 pr-4">이름</th>
                    <th className="py-2 pr-4">이메일</th>
                    <th className="py-2">역할</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-zinc-700">
                      <td className="py-2 pr-4 font-mono font-medium">{u.id}</td>
                      <td className="py-2 pr-4">{u.name}</td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="py-2">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!listLoading && userList.length === 0 && nameSearch.trim() !== '' && (
            <p className="mt-3 text-slate-500 dark:text-slate-400">검색 결과가 없습니다.</p>
          )}
          {!listLoading && userList.length === 0 && nameSearch.trim() === '' && (
            <p className="mt-3 text-slate-500 dark:text-slate-400">등록된 사용자가 없습니다. 사용자 생성을 먼저 해 주세요.</p>
          )}
        </section>
      </div>
    </div>
  );
}
