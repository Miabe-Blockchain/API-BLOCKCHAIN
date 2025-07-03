const { Op } = require('sequelize');
const Diploma = require('../models/Diploma');
const User = require('../models/User');
const logger = require('../utils/logger');

class AnalyticsService {
  async getDashboardStats() {
    try {
      const [
        totalDiplomas,
        totalUsers,
        diplomasThisMonth,
        diplomasThisWeek,
        blockchainRegistered,
        pendingBlockchain,
        usersByRole,
        diplomasByType,
        recentActivity
      ] = await Promise.all([
        // Statistiques générales
        Diploma.count(),
        User.count(),
        
        // Diplômes ce mois-ci
        Diploma.count({
          where: {
            created_at: {
              [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        
        // Diplômes cette semaine
        Diploma.count({
          where: {
            created_at: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Diplômes enregistrés sur blockchain
        Diploma.count({
          where: {
            blockchain_registered_at: {
              [Op.ne]: null
            }
          }
        }),
        
        // Diplômes en attente d'enregistrement blockchain
        Diploma.count({
          where: {
            blockchain_registered_at: null
          }
        }),
        
        // Utilisateurs par rôle
        User.findAll({
          attributes: [
            'role',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          group: ['role']
        }),
        
        // Diplômes par type
        Diploma.findAll({
          attributes: [
            'diploma_type',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          group: ['diploma_type']
        }),
        
        // Activité récente
        Diploma.findAll({
          include: [{
            model: User,
            as: 'issuer',
            attributes: ['first_name', 'last_name', 'email']
          }],
          order: [['created_at', 'DESC']],
          limit: 10
        })
      ]);

      // Statistiques par mois (12 derniers mois)
      const monthlyStats = await this.getMonthlyStats();
      
      // Statistiques par institution
      const institutionStats = await this.getInstitutionStats();
      
      // Statistiques blockchain
      const blockchainStats = await this.getBlockchainStats();

      return {
        overview: {
          totalDiplomas,
          totalUsers,
          diplomasThisMonth,
          diplomasThisWeek,
          blockchainRegistered,
          pendingBlockchain,
          blockchainPercentage: totalDiplomas > 0 ? Math.round((blockchainRegistered / totalDiplomas) * 100) : 0
        },
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: parseInt(item.dataValues.count)
        })),
        diplomasByType: diplomasByType.map(item => ({
          type: item.diploma_type,
          count: parseInt(item.dataValues.count)
        })),
        recentActivity: recentActivity.map(diploma => ({
          id: diploma.id,
          diploma_name: diploma.diploma_name,
          student_name: `${diploma.student_firstname} ${diploma.student_lastname}`,
          issuer_name: diploma.issuer ? `${diploma.issuer.first_name} ${diploma.issuer.last_name}` : 'Inconnu',
          created_at: diploma.created_at,
          blockchain_registered: !!diploma.blockchain_registered_at
        })),
        monthlyStats,
        institutionStats,
        blockchainStats
      };
    } catch (error) {
      logger.error('Erreur récupération statistiques dashboard:', error);
      throw error;
    }
  }

  async getMonthlyStats() {
    try {
      const stats = await Diploma.findAll({
        attributes: [
          [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('created_at')), 'month'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(new Date().getFullYear() - 1, 0, 1)
          }
        },
        group: [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('created_at'))],
        order: [[require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('created_at')), 'ASC']]
      });

      return stats.map(item => ({
        month: item.dataValues.month,
        count: parseInt(item.dataValues.count)
      }));
    } catch (error) {
      logger.error('Erreur récupération statistiques mensuelles:', error);
      return [];
    }
  }

  async getInstitutionStats() {
    try {
      const stats = await Diploma.findAll({
        attributes: [
          'issuer_institution',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
          [require('sequelize').fn('COUNT', require('sequelize').fn('CASE', {
            when: { blockchain_registered_at: { [Op.ne]: null } },
            then: 1
          })), 'blockchain_count']
        ],
        group: ['issuer_institution'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
        limit: 10
      });

      return stats.map(item => ({
        institution: item.issuer_institution,
        total: parseInt(item.dataValues.count),
        blockchain: parseInt(item.dataValues.blockchain_count),
        percentage: Math.round((parseInt(item.dataValues.blockchain_count) / parseInt(item.dataValues.count)) * 100)
      }));
    } catch (error) {
      logger.error('Erreur récupération statistiques institutions:', error);
      return [];
    }
  }

  async getBlockchainStats() {
    try {
      const [
        totalTransactions,
        totalGasUsed,
        averageGasPerTransaction,
        transactionsThisMonth,
        transactionsThisWeek
      ] = await Promise.all([
        // Total des transactions
        Diploma.count({
          where: {
            blockchain_transaction_hash: {
              [Op.ne]: null
            }
          }
        }),
        
        // Gas total utilisé (approximatif)
        Diploma.sum('blockchain_gas_used', {
          where: {
            blockchain_gas_used: {
              [Op.ne]: null
            }
          }
        }),
        
        // Gas moyen par transaction
        Diploma.findOne({
          attributes: [
            [require('sequelize').fn('AVG', require('sequelize').col('blockchain_gas_used')), 'average']
          ],
          where: {
            blockchain_gas_used: {
              [Op.ne]: null
            }
          }
        }),
        
        // Transactions ce mois-ci
        Diploma.count({
          where: {
            blockchain_registered_at: {
              [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        
        // Transactions cette semaine
        Diploma.count({
          where: {
            blockchain_registered_at: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        totalTransactions,
        totalGasUsed: totalGasUsed || 0,
        averageGasPerTransaction: averageGasPerTransaction ? Math.round(averageGasPerTransaction.dataValues.average) : 0,
        transactionsThisMonth,
        transactionsThisWeek
      };
    } catch (error) {
      logger.error('Erreur récupération statistiques blockchain:', error);
      return {
        totalTransactions: 0,
        totalGasUsed: 0,
        averageGasPerTransaction: 0,
        transactionsThisMonth: 0,
        transactionsThisWeek: 0
      };
    }
  }

  async getUserStats(userId) {
    try {
      const [
        totalDiplomas,
        blockchainRegistered,
        recentDiplomas,
        diplomasByType
      ] = await Promise.all([
        // Total des diplômes de l'utilisateur
        Diploma.count({
          where: { issuer_id: userId }
        }),
        
        // Diplômes enregistrés sur blockchain
        Diploma.count({
          where: {
            issuer_id: userId,
            blockchain_registered_at: {
              [Op.ne]: null
            }
          }
        }),
        
        // Diplômes récents
        Diploma.findAll({
          where: { issuer_id: userId },
          order: [['created_at', 'DESC']],
          limit: 5
        }),
        
        // Diplômes par type
        Diploma.findAll({
          attributes: [
            'diploma_type',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          where: { issuer_id: userId },
          group: ['diploma_type']
        })
      ]);

      return {
        totalDiplomas,
        blockchainRegistered,
        blockchainPercentage: totalDiplomas > 0 ? Math.round((blockchainRegistered / totalDiplomas) * 100) : 0,
        recentDiplomas: recentDiplomas.map(diploma => ({
          id: diploma.id,
          diploma_name: diploma.diploma_name,
          student_name: `${diploma.student_firstname} ${diploma.student_lastname}`,
          created_at: diploma.created_at,
          blockchain_registered: !!diploma.blockchain_registered_at
        })),
        diplomasByType: diplomasByType.map(item => ({
          type: item.diploma_type,
          count: parseInt(item.dataValues.count)
        }))
      };
    } catch (error) {
      logger.error('Erreur récupération statistiques utilisateur:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService(); 