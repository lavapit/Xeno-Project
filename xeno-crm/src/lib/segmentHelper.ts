import { prisma } from './prisma';

export async function getMatchingCustomers(filterQuery: any) {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!filterQuery || typeof filterQuery !== 'object') {
    return customers;
  }

  return customers.filter((customer) => {
    const totalSpend = customer.orders.reduce((sum, o) => sum + o.amount, 0);
    const orderCount = customer.orders.length;
    const lastOrderDate = customer.orders.length > 0 ? customer.orders[0].createdAt : null;

    // Filter by minSpend
    if (filterQuery.minSpend !== undefined && filterQuery.minSpend !== null) {
      const minSpend = parseFloat(filterQuery.minSpend);
      if (!isNaN(minSpend) && totalSpend < minSpend) return false;
    }

    // Filter by maxSpend
    if (filterQuery.maxSpend !== undefined && filterQuery.maxSpend !== null) {
      const maxSpend = parseFloat(filterQuery.maxSpend);
      if (!isNaN(maxSpend) && totalSpend > maxSpend) return false;
    }

    // Filter by minOrders
    if (filterQuery.minOrders !== undefined && filterQuery.minOrders !== null) {
      const minOrders = parseInt(filterQuery.minOrders, 10);
      if (!isNaN(minOrders) && orderCount < minOrders) return false;
    }

    // Filter by city
    if (filterQuery.city && typeof filterQuery.city === 'string' && filterQuery.city.trim() !== '') {
      if (!customer.city || customer.city.toLowerCase() !== filterQuery.city.toLowerCase().trim()) return false;
    }

    // Filter by channel
    if (filterQuery.channel && typeof filterQuery.channel === 'string' && filterQuery.channel.trim() !== '') {
      if (!customer.channel || customer.channel.toLowerCase() !== filterQuery.channel.toLowerCase().trim()) return false;
    }

    // Filter by inactiveDays
    if (filterQuery.inactiveDays !== undefined && filterQuery.inactiveDays !== null) {
      const inactiveDays = parseInt(filterQuery.inactiveDays, 10);
      if (!isNaN(inactiveDays)) {
        if (!lastOrderDate) return false; // If no orders, they don't match
        const daysSinceLastOrder = (Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastOrder < inactiveDays) return false;
      }
    }

    // Filter by activeDays
    if (filterQuery.activeDays !== undefined && filterQuery.activeDays !== null) {
      const activeDays = parseInt(filterQuery.activeDays, 10);
      if (!isNaN(activeDays)) {
        if (!lastOrderDate) return false;
        const daysSinceLastOrder = (Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastOrder > activeDays) return false;
      }
    }

    return true;
  });
}
